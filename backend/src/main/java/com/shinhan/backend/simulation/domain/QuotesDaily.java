// QuotesDaily.java
package com.shinhan.backend.simulation.domain; // 실제 프로젝트의 패키지 경로에 맞게 수정해주세요!
// (예: com.shinhan.backend.quotes.domain 또는 com.shinhan.backend.data.domain 등)

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate; // LocalDate 임포트

@Getter
@Setter
@ToString
public class QuotesDaily {
    private LocalDate date;       // DB의 'Date' 컬럼 (YYYY-MM-DD)
    private double fxRate;        // DB의 'FX_RATE' 컬럼
    private double vix;           // DB의 'VIX' 컬럼
    private double etfVolume;     // DB의 'ETF_VOLUME' 컬럼
    private double goldClose;     // DB의 'KRW_G_CLOSE' 컬럼 (우리는 종가를 사용할 예정)
    // 필요한 경우 다른 컬럼도 추가할 수 있습니다:
    // private double krwGOpen;   // KRW_G_OPEN
    // private double usdOzOpen;  // USD_OZ_OPEN
    // private double usdOzClose; // USD_OZ_CLOSE
}