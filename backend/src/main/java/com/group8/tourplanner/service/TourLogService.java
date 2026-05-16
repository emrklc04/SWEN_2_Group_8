package com.group8.tourplanner.service;

import com.group8.tourplanner.model.Tour;
import com.group8.tourplanner.model.TourLog;
import com.group8.tourplanner.repository.TourLogRepository;
import com.group8.tourplanner.repository.TourRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TourLogService {

    private final TourLogRepository tourLogRepository;
    private final TourRepository tourRepository;

    public TourLogService(TourLogRepository tourLogRepository, TourRepository tourRepository) {
        this.tourLogRepository = tourLogRepository;
        this.tourRepository = tourRepository;
    }

    public List<TourLog> getAllTourLogs() {
        return tourLogRepository.findAll();
    }

    public List<TourLog> getTourLogsByTourId(Long tourId) {
        return tourLogRepository.findByTourId(tourId);
    }

    public TourLog getTourLogById(Long id) {
        Optional<TourLog> tourLog = tourLogRepository.findById(id);
        return tourLog.orElse(null);
    }

    public TourLog createTourLog(Long tourId, TourLog tourLog) {
        Optional<Tour> optionalTour = tourRepository.findById(tourId);

        if (optionalTour.isPresent()) {
            tourLog.setTour(optionalTour.get());
            return tourLogRepository.save(tourLog);
        }

        return null;
    }

    public TourLog updateTourLog(Long id, TourLog updatedTourLog) {
        Optional<TourLog> optionalTourLog = tourLogRepository.findById(id);

        if (optionalTourLog.isPresent()) {
            TourLog tourLog = optionalTourLog.get();

            tourLog.setDateTime(updatedTourLog.getDateTime());
            tourLog.setComment(updatedTourLog.getComment());
            tourLog.setDifficulty(updatedTourLog.getDifficulty());
            tourLog.setTotalDistance(updatedTourLog.getTotalDistance());
            tourLog.setTotalTime(updatedTourLog.getTotalTime());
            tourLog.setRating(updatedTourLog.getRating());

            return tourLogRepository.save(tourLog);
        }

        return null;
    }

    public void deleteTourLog(Long id) {
        tourLogRepository.deleteById(id);
    }
}