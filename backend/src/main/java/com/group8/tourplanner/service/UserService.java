package com.group8.tourplanner.service;

import com.group8.tourplanner.model.User;
import com.group8.tourplanner.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        Optional<User> user = userRepository.findById(id);

        return user.orElse(null);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User updateUser(Long id, User updatedUser) {
        Optional<User> optionalUser = userRepository.findById(id);

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();

            user.setUsername(updatedUser.getUsername());
            user.setEmail(updatedUser.getEmail());
            user.setPassword(updatedUser.getPassword());

            return userRepository.save(user);
        }

        return null;
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}