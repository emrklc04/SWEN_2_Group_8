package com.group8.tourplanner.repository;

import com.group8.tourplanner.model.Tour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TourRepository extends JpaRepository<Tour, Long> {

    List<Tour> findByUserId(Long userId);
}