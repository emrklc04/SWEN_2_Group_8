package com.group8.tourplanner.repository;

import com.group8.tourplanner.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

}