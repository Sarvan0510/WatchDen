package com.watchden.auth.security.services;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.watchden.auth.entity.Users;

public class UserDetailsImplementation implements UserDetails {
	
	private static final long serialVersionUID = 1L;

	private Long id;
	private String username;
	private String password;
	private String email;

	public UserDetailsImplementation(Long id, String username, String password, String email) {
		super();
		this.id = id;
		this.username = username;
		this.password = password;
		this.email = email;
	}
	
	//Build a UserDetailImplementation instance form a User
	public static UserDetailsImplementation build(Users user) {
		
		return new UserDetailsImplementation(
		
				user.getId(),
				user.getUsername(),
				user.getPassword(),
				user.getEmail()
		);	
	}
	

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		// TODO Auto-generated method stub
		return null;
	}
	
	public Long getId() {
		return id; // Return user ID
	}
	
	public String getEmail() {
		return email; // Return email
	}

	@Override
	public String getPassword() {
		// TODO Auto-generated method stub
		return password;
	}

	@Override
	public String getUsername() {
		// TODO Auto-generated method stub
		return username;
	}
	
	@Override
    public boolean isAccountNonExpired() {
        return true; // FIXED: Required for Spring Security
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // FIXED: Required for Spring Security
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // FIXED: Required for Spring Security
    }

    @Override
    public boolean isEnabled() {
        return true; // FIXED: Required for Spring Security
    }
    
    @Override
	public boolean equals(Object o) {
		if (this == o) // Check if the same object
			return true;
		if (o == null || getClass() != o.getClass()) // Check if the object is null or not of the same class
			return false;
		UserDetailsImplementation user = (UserDetailsImplementation) o; // Cast to UserDetailsImpl
		return id == user.id; // Check if IDs are equal
	}
}
