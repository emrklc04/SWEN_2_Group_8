package com.group8.tourplanner.controller;

import com.group8.tourplanner.model.Tour;
import com.group8.tourplanner.service.TourService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tours")
@CrossOrigin(origins = "http://localhost:4200")
public class TourController {

    private final TourService tourService;

    public TourController(TourService tourService) {
        this.tourService = tourService;
    }

    @GetMapping
    public List<Tour> getAllTours() {
        return tourService.getAllTours();
    }

    @GetMapping("/{id}")
    public Tour getTourById(@PathVariable Long id) {
        return tourService.getTourById(id);
    }

    @GetMapping("/user/{userId}")
    public List<Tour> getToursByUserId(@PathVariable Long userId) {
        return tourService.getToursByUserId(userId);
    }

    @PostMapping("/user/{userId}")
    public Tour createTour(@PathVariable Long userId, @RequestBody Tour tour) {
        return tourService.createTour(userId, tour);
    }

    @PutMapping("/{id}")
    public Tour updateTour(@PathVariable Long id, @RequestBody Tour updatedTour) {
        return tourService.updateTour(id, updatedTour);
    }

    @DeleteMapping("/{id}")
    public void deleteTour(@PathVariable Long id) {
        tourService.deleteTour(id);
    }
}