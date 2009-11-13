#include "global.h"

#ifndef FDEBUGCONFIG_H_
#define FDEBUGCONFIG_H_

struct messageFilter {
	bool message;
	bool warning;
	bool error;
	bool fatal;
};

struct debugOptions {
	int port;       // alternative fdebug port
	bool control;   // show fdebug control messages
	bool details;   // show message details
	bool variables; // show fdebug variables
	bool strict;    // ask before accepting connections from unknown hosts
};

class fDebugConfig {
public:
	static fDebugConfig* getInstance();
	void   init(int argc, char **argv);
	int    getPort();
	
	messageFilter filter;
	debugOptions options;
	
private:
	fDebugConfig() {}
	fDebugConfig(fDebugConfig const&){};            // copy constructor is private
	fDebugConfig& operator=(fDebugConfig const&){}; // assignment operator is private
	static fDebugConfig* m_pInstance;
	
	void printUsage();
	void initMessageFilter(messageFilter filter);
};

#endif /*FDEBUGCONFIG_H_*/
