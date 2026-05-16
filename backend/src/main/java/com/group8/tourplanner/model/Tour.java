package com.group8.tourplanner.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tours")
public class Tour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String fromLocation;
    private String toLocation;
    private String transportType;

    private double distance;
    private double estimatedTime;

    @Column(length = 5000)
    private String routeInformation;

    private String imagePath;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Tour() {
    }

    public Tour(Long id, String name, String description, String fromLocation, String toLocation,
                String transportType, double distance, double estimatedTime,
                String routeInformation, String imagePath, User user) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.fromLocation = fromLocation;
        this.toLocation = toLocation;
        this.transportType = transportType;
        this.distance = distance;
        this.estimatedTime = estimatedTime;
        this.routeInformation = routeInformation;
        this.imagePath = imagePath;
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getFromLocation() {
        return fromLocation;
    }

    public String getToLocation() {
        return toLocation;
    }

    public String getTransportType() {
        return transportType;
    }

    public double getDistance() {
        return distance;
    }

    public double getEstimatedTime() {
        return estimatedTime;
    }

    public String getRouteInformation() {
        return routeInformation;
    }

    public String getImagePath() {
        return imagePath;
    }

    public User getUser() {
        return user;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setFromLocation(String fromLocation) {
        this.fromLocation = fromLocation;
    }

    public void setToLocation(String toLocation) {
        this.toLocation = toLocation;
    }

    public void setTransportType(String transportType) {
        this.transportType = transportType;
    }

    public void setDistance(double distance) {
        this.distance = distance;
    }

    public void setEstimatedTime(double estimatedTime) {
        this.estimatedTime = estimatedTime;
    }

    public void setRouteInformation(String routeInformation) {
        this.routeInformation = routeInformation;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public void setUser(User user) {
        this.user = user;
    }
}