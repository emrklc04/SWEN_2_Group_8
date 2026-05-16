package com.group8.tourplanner.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tour_logs")
public class TourLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dateTime;

    @Column(length = 2000)
    private String comment;

    private int difficulty;
    private double totalDistance;
    private double totalTime;
    private int rating;

    @ManyToOne
    @JoinColumn(name = "tour_id")
    private Tour tour;

    public TourLog() {
    }

    public TourLog(Long id, LocalDateTime dateTime, String comment, int difficulty,
                   double totalDistance, double totalTime, int rating, Tour tour) {
        this.id = id;
        this.dateTime = dateTime;
        this.comment = comment;
        this.difficulty = difficulty;
        this.totalDistance = totalDistance;
        this.totalTime = totalTime;
        this.rating = rating;
        this.tour = tour;
    }

    public Long getId() {
        return id;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public String getComment() {
        return comment;
    }

    public int getDifficulty() {
        return difficulty;
    }

    public double getTotalDistance() {
        return totalDistance;
    }

    public double getTotalTime() {
        return totalTime;
    }

    public int getRating() {
        return rating;
    }

    public Tour getTour() {
        return tour;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public void setDifficulty(int difficulty) {
        this.difficulty = difficulty;
    }

    public void setTotalDistance(double totalDistance) {
        this.totalDistance = totalDistance;
    }

    public void setTotalTime(double totalTime) {
        this.totalTime = totalTime;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public void setTour(Tour tour) {
        this.tour = tour;
    }
}