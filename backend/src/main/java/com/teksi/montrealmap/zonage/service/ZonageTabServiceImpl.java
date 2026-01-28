package com.teksi.montrealmap.zonage.service;

import com.teksi.montrealmap.zonage.dto.ZonageTabCodeResponse;
import com.teksi.montrealmap.zonage.repository.RawZonageTabRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ZonageTabServiceImpl implements ZonageTabService {

    private final RawZonageTabRepository rawRepo;

    @Override
    public Optional<ZonageTabCodeResponse> getZoneCodeAtPoint(double lng, double lat) {
        return rawRepo.findNumeroCompletAtPoint(lng, lat).map(ZonageTabCodeResponse::new);
    }
}