package com.group8.tourplanner.repository;

import com.group8.tourplanner.model.TourLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TourLogRepository extends JpaRepository<TourLog, Long> {

    List<TourLog> findByTourId(Long tourId);
}