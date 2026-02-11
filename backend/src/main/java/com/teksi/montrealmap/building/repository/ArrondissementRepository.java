package com.teksi.montrealmap.building.repository;

import com.teksi.montrealmap.building.entity.Arrondissement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArrondissementRepository extends JpaRepository<Arrondissement, Integer> {

    Optional<Arrondissement> findByCodeRem(String codeRem);

    Optional<Arrondissement> findByNoArroElection(Integer noArroElection);
}
