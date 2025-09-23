// SimulationDashboardController.java (최종 수정본)
package com.shinhan.backend.simulation.controller;

import com.shinhan.backend.simulation.domain.SimulationRequest;
import com.shinhan.backend.simulation.domain.SimulationResult;
import com.shinhan.backend.simulation.dto.QuoteRowDto;
import com.shinhan.backend.simulation.service.SimulationDashboardService;
import com.shinhan.backend.simulation.service.SimulationService; // 우리가 만든 서비스
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 만들어줍니다.
@RequestMapping("/api/simulation")
public class SimulationDashboardController {

    // final 키워드를 사용하면 @Autowired 없이도 생성자를 통해 의존성이 주입됩니다.
    private final SimulationDashboardService simulationDashboardService; // 기존에 있던 대시보드 서비스
    private final SimulationService simulationService;                   // 우리가 새로 만든 시뮬레이션 서비스

    // 기존 getQuotes 메소드는 그대로 둡니다.
    // 이 메소드는 대시보드의 기본 시세 그래프 데이터를 제공합니다.
    @GetMapping("/quotes")
    public List<QuoteRowDto> quotes(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,

            @RequestParam(defaultValue = "10y") String unit
    ){
        return simulationDashboardService.getQuotes(to, unit, from);
    }

    // ↓↓↓↓↓↓↓↓↓ 우리가 새로 추가한 '매수/매도' 시뮬레이션 API 메소드입니다. ↓↓↓↓↓↓↓↓↓
    /**
     * 사용자의 매수/매도 요청을 받아 투자 시뮬레이션을 실행하고 결과를 반환합니다.
     * API Endpoint: POST /api/simulation/trade
     */
    @PostMapping("/trade")
    public SimulationResult runTradeSimulation(@RequestBody SimulationRequest request) {
        return simulationService.runTradeSimulation(request);
    }
}