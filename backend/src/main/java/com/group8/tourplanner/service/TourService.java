package com.group8.tourplanner.service;

import com.group8.tourplanner.model.Tour;
import com.group8.tourplanner.model.User;
import com.group8.tourplanner.repository.TourRepository;
import com.group8.tourplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TourService {

    private final TourRepository tourRepository;
    private final UserRepository userRepository;

    public TourService(TourRepository tourRepository, UserRepository userRepository) {
        this.tourRepository = tourRepository;
        this.userRepository = userRepository;
    }

    public List<Tour> getAllTours() {
        return tourRepository.findAll();
    }

    public List<Tour> getToursByUserId(Long userId) {
        return tourRepository.findByUserId(userId);
    }

    public Tour getTourById(Long id) {
        Optional<Tour> tour = tourRepository.findById(id);
        return tour.orElse(null);
    }

    public Tour createTour(Long userId, Tour tour) {
        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalUser.isPresent()) {
            tour.setUser(optionalUser.get());
            return tourRepository.save(tour);
        }

        return null;
    }

    public Tour updateTour(Long id, Tour updatedTour) {
        Optional<Tour> optionalTour = tourRepository.findById(id);

        if (optionalTour.isPresent()) {
            Tour tour = optionalTour.get();

            tour.setName(updatedTour.getName());
            tour.setDescription(updatedTour.getDescription());
            tour.setFromLocation(updatedTour.getFromLocation());
            tour.setToLocation(updatedTour.getToLocation());
            tour.setTransportType(updatedTour.getTransportType());
            tour.setDistance(updatedTour.getDistance());
            tour.setEstimatedTime(updatedTour.getEstimatedTime());
            tour.setRouteInformation(updatedTour.getRouteInformation());
            tour.setImagePath(updatedTour.getImagePath());

            return tourRepository.save(tour);
        }

        return null;
    }

    public void deleteTour(Long id) {
        tourRepository.deleteById(id);
    }
}