package com.shinhan.backend.simulation.service.impl;

import com.shinhan.backend.simulation.domain.QuotesDaily;
import com.shinhan.backend.simulation.dto.QuoteRowDto;
import com.shinhan.backend.simulation.mapper.QuotesMapper;
import com.shinhan.backend.simulation.service.SimulationDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SimulationDashboardServiceImpl implements SimulationDashboardService {

    private final QuotesMapper quotesMapper;

    @Override
    public List<QuoteRowDto> getQuotes(LocalDate to, String unit, LocalDate from) {
        if (from == null) {
            from = switch (unit) {
                case "10y" -> to.minusYears(10);
                case "5y" -> to.minusYears(5);
                case "1y" -> to.minusYears(1);
                case "3m" -> to.minusMonths(3);
                case "1m" -> to.minusMonths(1);
                default -> to.minusWeeks(1);
            };
        }

        List<QuotesDaily> dailyQuotes = quotesMapper.selectQuotes(from, to);

        return dailyQuotes.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // [수정됨] QuotesDaily 객체를 QuoteRowDto 객체로 변환하는 로직 수정
    private QuoteRowDto convertToDto(QuotesDaily daily) {
        if (daily == null) {
            return null;
        }
        // Lombok의 @AllArgsConstructor를 통해 생성된 생성자를 사용하여 안전하게 객체 생성
        return new QuoteRowDto(
                daily.getDate().toString(),
                daily.getFxRate(),
                daily.getVix(),
                daily.getEtfVolume(),
                daily.getGoldClose(),
                null // pred_close는 현재 없으므로 null로 설정
        );
    }
}