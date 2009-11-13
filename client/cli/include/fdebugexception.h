#ifndef FDEBUGEXCEPTION_H_
#define FDEBUGEXCEPTION_H_

class fDebugException {
private:
	char *message;
public:
	fDebugException(const char * message);
	char* getMessage();
};

#endif /*FDEBUGEXCEPTION_H_*/
