// SimulationDashboardServiceImpl.java

package com.shinhan.backend.simulation.service.impl;

import com.shinhan.backend.simulation.domain.QuotesDaily; // QuotesDaily 임포트
import com.shinhan.backend.simulation.dto.QuoteRowDto;
import com.shinhan.backend.simulation.mapper.QuotesMapper;
import com.shinhan.backend.simulation.service.SimulationDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors; // Collectors 임포트를 추가해야 합니다.

@Service
@RequiredArgsConstructor
public class SimulationDashboardServiceImpl implements SimulationDashboardService {

    private final QuotesMapper quotesMapper;

    @Override
    public List<QuoteRowDto> getQuotes(LocalDate to, String unit, LocalDate from) {
        // from이 null이면 unit 기준으로 계산 (기존 로직)
        if (from == null) {
            from = switch (unit) {
                case "10y" -> to.minusYears(10);
                case "5y" -> to.minusYears(5);
                case "1y" -> to.minusYears(1);
                case "3m" -> to.minusMonths(3);
                case "1m" -> to.minusMonths(1);
                default -> to.minusWeeks(1); // 1w
            };
        }

        // --- ↓↓↓↓↓↓↓↓↓ 여기가 수정 포인트입니다! ↓↓↓↓↓↓↓↓↓ ---

        // 1. DB에서 원본 데이터(List<QuotesDaily>)를 가져옵니다.
        List<QuotesDaily> dailyQuotes = quotesMapper.selectQuotes(from, to);

        // 2. 원본 데이터를 DTO 형태로 변환하여 반환합니다.
        return dailyQuotes.stream()
                .map(this::convertToDto) // 각 QuotesDaily를 QuoteRowDto로 변환
                .collect(Collectors.toList()); // 변환된 DTO들을 다시 List로 묶음
    }

    // QuotesDaily 객체를 QuoteRowDto 객체로 변환하는 private 헬퍼 메소드
    private QuoteRowDto convertToDto(QuotesDaily daily) {
        if (daily == null) {
            return null;
        }
        return new QuoteRowDto(
                daily.getDate().toString(), // LocalDate를 String으로 변환
                daily.getFxRate(),
                daily.getVix(),
                daily.getEtfVolume(),
                daily.getGoldClose(),
                null // pred_close는 현재 없으므로 null로 설정
        );
    }
    // --- ↑↑↑↑↑↑↑↑↑↑ 여기가 수정 포인트입니다! ↑↑↑↑↑↑↑↑↑↑ ---
}