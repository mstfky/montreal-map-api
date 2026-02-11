package com.teksi.montrealmap.admin.controller;

import com.teksi.montrealmap.building.entity.Arrondissement;
import com.teksi.montrealmap.building.repository.ArrondissementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/arrondissements")
public class ArrondissementController {

    private final ArrondissementRepository arrondissementRepository;

    @GetMapping
    public List<ArrondissementDto> getAll() {
        return arrondissementRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    private ArrondissementDto toDto(Arrondissement a) {
        return new ArrondissementDto(
                a.getId(),
                a.getNomOfficiel(),
                a.getNomAbrege(),
                a.getAcronyme(),
                a.getCode3l(),
                a.getIdUadm(),
                a.getNoArroElection(),
                a.getCodeRem()
        );
    }

    public record ArrondissementDto(
            Integer id,
            String nomOfficiel,
            String nomAbrege,
            String acronyme,
            String code3l,
            Integer idUadm,
            Integer noArroElection,
            String codeRem
    ) {}
}
