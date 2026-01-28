package com.watchden.room.exception;

public class UnauthorizedRoomActionException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	public UnauthorizedRoomActionException() {
		// TODO Auto-generated constructor stub
	}

	public UnauthorizedRoomActionException(String message) {
		super(message);
		// TODO Auto-generated constructor stub
	}

	public UnauthorizedRoomActionException(Throwable cause) {
		super(cause);
		// TODO Auto-generated constructor stub
	}

	public UnauthorizedRoomActionException(String message, Throwable cause) {
		super(message, cause);
		// TODO Auto-generated constructor stub
	}

	public UnauthorizedRoomActionException(String message, Throwable cause, boolean enableSuppression,
			boolean writableStackTrace) {
		super(message, cause, enableSuppression, writableStackTrace);
		// TODO Auto-generated constructor stub
	}

}
