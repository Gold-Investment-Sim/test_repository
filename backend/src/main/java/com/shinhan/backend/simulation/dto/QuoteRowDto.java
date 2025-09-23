package com.shinhan.backend.simulation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor // [수정됨] 모든 필드를 인자로 받는 생성자 자동 생성
public class QuoteRowDto {
    // [수정됨] 프론트엔드와 데이터 형식을 맞추기 위해 String으로 변경
    private String date;

    private Double fx_rate;
    private Double vix;
    private Double etf_volume;
    private Double gold_close;
    private Double pred_close;
}