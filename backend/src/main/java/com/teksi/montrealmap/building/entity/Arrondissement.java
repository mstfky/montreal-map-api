package com.teksi.montrealmap.building.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "arrondissements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Arrondissement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nom_officiel")
    private String nomOfficiel;

    @Column(name = "nom_abrege")
    private String nomAbrege;

    private String acronyme;

    @Column(name = "code_3l")
    private String code3l;

    @Column(name = "id_uadm")
    private Integer idUadm;

    @Column(name = "no_arro_election")
    private Integer noArroElection;

    @Column(name = "code_rem")
    private String codeRem;
}
