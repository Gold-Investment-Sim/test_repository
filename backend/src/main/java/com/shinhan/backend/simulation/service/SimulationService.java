// SimulationService.java
package com.shinhan.backend.simulation.service; // 실제 프로젝트의 패키지 경로에 맞게 수정해주세요!
// (예: com.shinhan.backend.service 또는 com.shinhan.backend.simulation.service 등)

import com.shinhan.backend.simulation.domain.SimulationRequest; // 1단계에서 만든 DTO 임포트
import com.shinhan.backend.simulation.domain.SimulationResult; // 1단계에서 만든 DTO 임포트
import com.shinhan.backend.simulation.mapper.QuotesMapper;         // 2-2단계에서 확인한 매퍼 임포트
import com.shinhan.backend.simulation.domain.QuotesDaily;          // 2-1단계에서 확인한 엔티티 임포트 (패키지 경로 주의!)
import org.springframework.beans.factory.annotation.Autowired; // 의존성 주입을 위한 임포트
import org.springframework.stereotype.Service;             // 서비스 클래스임을 나타내는 어노테이션

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.util.Optional; // Optional 클래스 임포트

@Service // 이 클래스가 스프링의 서비스 레이어 컴포넌트임을 나타냅니다.
public class SimulationService {

    @Autowired // 스프링이 QuotesMapper 객체를 자동으로 주입해줍니다.
    private QuotesMapper quotesMapper;

    /**
     * 사용자의 매수/매도 요청에 따라 금 투자 시뮬레이션을 실행합니다.
     * @param request 매수 날짜, 매도 날짜, 매수 금액을 포함하는 요청 객체
     * @return 시뮬레이션 결과 (수익률, 최종 금액 등)
     */
    public SimulationResult runTradeSimulation(SimulationRequest request) {
        LocalDate buyDate = request.getBuyDate();     // 요청에서 매수 날짜 가져오기
        LocalDate sellDate = request.getSellDate();   // 요청에서 매도 날짜 가져오기
        double buyAmount = request.getBuyAmount();    // 요청에서 매수 금액 가져오기

        // 1. 요청 유효성 검사 (매수 날짜, 매도 날짜, 금액 등)
        if (buyDate == null || sellDate == null || buyAmount <= 0) {
            // 필수값이 없거나 금액이 유효하지 않으면 예외 발생
            throw new IllegalArgumentException("매수 날짜, 매도 날짜, 매수 금액은 필수이며, 매수 금액은 0보다 커야 합니다.");
        }
        if (buyDate.isAfter(sellDate)) {
            // 매수 날짜가 매도 날짜보다 이후이면 예외 발생
            throw new IllegalArgumentException("매수 날짜는 매도 날짜보다 빨라야 합니다.");
        }

        // 2. DB에서 필요한 모든 기간의 시세 데이터 가져오기 (매수일부터 매도일까지)
        // quotesMapper의 selectQuotes 메소드를 사용하여 DB에서 시세 데이터를 가져옵니다.
        List<QuotesDaily> allQuotes = quotesMapper.selectQuotes(buyDate, sellDate);

        if (allQuotes == null || allQuotes.isEmpty()) {
            // 해당 날짜 범위에 시세 데이터가 없으면 예외 발생
            throw new RuntimeException("요청된 날짜 범위에 해당하는 시세 데이터가 없습니다. (기간: " + buyDate + " ~ " + sellDate + ")");
        }

        // 3. 매수 시점의 금 가격 찾기
        // 가져온 시세 데이터 목록에서 매수 날짜와 정확히 일치하는 데이터를 찾습니다.
        Optional<QuotesDaily> buyQuoteOpt = allQuotes.stream()
                .filter(q -> q.getDate().isEqual(buyDate))
                .findFirst();

        if (!buyQuoteOpt.isPresent()) {
            // 매수 날짜에 해당하는 시세 데이터가 없으면 예외 발생
            throw new RuntimeException("매수 날짜(" + buyDate + ")에 해당하는 시세 데이터가 없습니다.");
        }
        double actualBuyPricePerGram = buyQuoteOpt.get().getGoldClose(); // 매수일의 종가 사용

        // 4. 매도 시점의 금 가격 찾기
        // 가져온 시세 데이터 목록에서 매도 날짜와 정확히 일치하는 데이터를 찾습니다.
        Optional<QuotesDaily> sellQuoteOpt = allQuotes.stream()
                .filter(q -> q.getDate().isEqual(sellDate))
                .findFirst();

        if (!sellQuoteOpt.isPresent()) {
            // 매도 날짜에 해당하는 시세 데이터가 없으면 예외 발생
            throw new RuntimeException("매도 날짜(" + sellDate + ")에 해당하는 시세 데이터가 없습니다.");
        }
        double actualSellPricePerGram = sellQuoteOpt.get().getGoldClose(); // 매도일의 종가 사용

        // 5. 시뮬레이션 계산
        // 매수 금액으로 몇 그램의 금을 살 수 있었는지 계산
        double purchasedGrams = buyAmount / actualBuyPricePerGram;
        // 매도 시점의 금 가격으로 계산된 최종 가치
        double finalValue = purchasedGrams * actualSellPricePerGram;

        // 총 손익 및 수익률 계산
        double totalProfitLoss = finalValue - buyAmount;
        double yieldRate = (totalProfitLoss / buyAmount) * 100; // 수익률을 백분율로 표현

        // 6. 포트폴리오 히스토리 (그래프 데이터) 생성
        // 매수일부터 매도일까지 각 날짜별로 자산 가치가 어떻게 변했는지 기록합니다.
        List<Map<String, Object>> portfolioHistory = new ArrayList<>();
        for (QuotesDaily quote : allQuotes) {
            Map<String, Object> historyEntry = new HashMap<>();
            historyEntry.put("date", quote.getDate().toString());              // 날짜
            historyEntry.put("value", purchasedGrams * quote.getGoldClose()); // 해당 날짜의 평가 금액
            portfolioHistory.add(historyEntry);
        }

        // 7. 시뮬레이션 결과 반환
        // 모든 계산 결과를 SimulationResult 객체에 담아 반환합니다.
        return SimulationResult.builder()
                .buyPrice(actualBuyPricePerGram)
                .sellPrice(actualSellPricePerGram)
                .buyAmount(buyAmount)
                .purchasedGrams(purchasedGrams)
                .finalValue(finalValue)
                .totalProfitLoss(totalProfitLoss)
                .yieldRate(yieldRate)
                .portfolioHistory(portfolioHistory)
                .build();
    }
}