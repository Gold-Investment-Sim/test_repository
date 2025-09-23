// QuotesMapper.java
package com.shinhan.backend.simulation.mapper; // 실제 프로젝트의 패키지 경로에 맞게 수정해주세요!

import com.shinhan.backend.simulation.domain.QuotesDaily; // QuotesDaily 임포트
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper // MyBatis 매퍼임을 나타냅니다.
public interface QuotesMapper {
    // 특정 날짜 범위의 시세 데이터를 가져오는 메소드입니다.
    List<QuotesDaily> selectQuotes(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}