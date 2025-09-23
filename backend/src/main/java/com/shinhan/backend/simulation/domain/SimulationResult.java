// SimulationResult.java
package com.shinhan.backend.simulation.domain; // 해찬님 프로젝트의 정확한 패키지 경로

import lombok.Builder;  // Lombok 라이브러리: Builder 패턴 자동 생성 (객체 생성을 더 편리하게 해줍니다)
import lombok.Getter;   // Lombok 라이브러리: Getter 메소드 자동 생성
import lombok.Setter;   // Lombok 라이브러리: Setter 메소드 자동 생성
import java.util.List;  // List 타입을 사용하기 위한 임포트
import java.util.Map;   // Map 타입을 사용하기 위한 임포트 (그래프 데이터에 주로 사용)

@Getter // 이 어노테이션을 추가하면 모든 필드에 대한 getter 메소드가 자동으로 생성됩니다.
@Setter // 이 어노테이션을 추가하면 모든 필드에 대한 setter 메소드가 자동으로 생성됩니다.
@Builder // 이 어노테이션을 추가하면 SimulationResult 객체를 .builder().필드1(값1).필드2(값2).build() 와 같이 만들 수 있습니다.
public class SimulationResult {
    private double buyPrice;        // 시뮬레이션 매수 시점의 금 1그램당 가격
    private double sellPrice;       // 시뮬레이션 매도 시점의 금 1그램당 가격
    private double buyAmount;       // 사용자가 매수한 초기 금액
    private double purchasedGrams;  // 초기 금액으로 매수된 금의 총 그램 수
    private double finalValue;      // 시뮬레이션 매도 후 최종적으로 얻게 되는 금액
    private double totalProfitLoss; // 매수 금액 대비 최종 금액의 총 손익 (수익이면 양수, 손실이면 음수)
    private double yieldRate;       // 총 손익을 초기 매수 금액으로 나눈 수익률 (백분율, 예: 10.5% 면 10.5)
    private List<Map<String, Object>> portfolioHistory; // 매수일부터 매도일까지 매일매일의 자산 가치 변화 (그래프를 그릴 때 사용할 데이터)
}