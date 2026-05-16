package com.group8.tourplanner.controller;

import com.group8.tourplanner.model.TourLog;
import com.group8.tourplanner.service.TourLogService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tourlogs")
@CrossOrigin(origins = "http://localhost:4200")
public class TourLogController {

    private final TourLogService tourLogService;

    public TourLogController(TourLogService tourLogService) {
        this.tourLogService = tourLogService;
    }

    @GetMapping
    public List<TourLog> getAllTourLogs() {
        return tourLogService.getAllTourLogs();
    }

    @GetMapping("/{id}")
    public TourLog getTourLogById(@PathVariable Long id) {
        return tourLogService.getTourLogById(id);
    }

    @GetMapping("/tour/{tourId}")
    public List<TourLog> getTourLogsByTourId(@PathVariable Long tourId) {
        return tourLogService.getTourLogsByTourId(tourId);
    }

    @PostMapping("/tour/{tourId}")
    public TourLog createTourLog(@PathVariable Long tourId, @RequestBody TourLog tourLog) {
        return tourLogService.createTourLog(tourId, tourLog);
    }

    @PutMapping("/{id}")
    public TourLog updateTourLog(@PathVariable Long id, @RequestBody TourLog updatedTourLog) {
        return tourLogService.updateTourLog(id, updatedTourLog);
    }

    @DeleteMapping("/{id}")
    public void deleteTourLog(@PathVariable Long id) {
        tourLogService.deleteTourLog(id);
    }
}