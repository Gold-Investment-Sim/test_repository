// SimulationRequest.java
package com.shinhan.backend.simulation.domain; // 해찬님 프로젝트의 정확한 패키지 경로

import java.time.LocalDate; // 날짜 타입을 사용하기 위한 임포트
import lombok.Getter;       // Lombok 라이브러리: Getter 메소드 자동 생성
import lombok.Setter;       // Lombok 라이브러리: Setter 메소드 자동 생성
import lombok.ToString;     // Lombok 라이브러리: toString 메소드 자동 생성

@Getter // 이 어노테이션을 추가하면 모든 필드에 대한 getter 메소드가 자동으로 생성됩니다.
@Setter // 이 어노테이션을 추가하면 모든 필드에 대한 setter 메소드가 자동으로 생성됩니다.
@ToString // 이 어노테이션을 추가하면 객체의 내용을 문자열로 쉽게 확인할 수 있는 toString 메소드가 자동으로 생성됩니다.
public class SimulationRequest {
    private LocalDate buyDate;   // 사용자가 금을 매수할 날짜 (YYYY-MM-DD 형식)
    private LocalDate sellDate;  // 사용자가 금을 매도할 날짜 (YYYY-MM-DD 형식)
    private double buyAmount;    // 사용자가 금을 매수할 초기 투자 금액 (예: 100만원이면 1000000.0)
}