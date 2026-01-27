package com.watchden.room.exception;

public class AlreadyJoinedException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	public AlreadyJoinedException() {
		// TODO Auto-generated constructor stub
	}

	public AlreadyJoinedException(String message) {
		super(message);
		// TODO Auto-generated constructor stub
	}

	public AlreadyJoinedException(Throwable cause) {
		super(cause);
		// TODO Auto-generated constructor stub
	}

	public AlreadyJoinedException(String message, Throwable cause) {
		super(message, cause);
		// TODO Auto-generated constructor stub
	}

	public AlreadyJoinedException(String message, Throwable cause, boolean enableSuppression,
			boolean writableStackTrace) {
		super(message, cause, enableSuppression, writableStackTrace);
		// TODO Auto-generated constructor stub
	}

}
