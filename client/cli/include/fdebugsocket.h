#ifndef FDEBUGSOCKET_H_
#define FDEBUGSOCKET_H_

#include <netinet/in.h>
#include "fdebugclient.h"

class fDebugSocket {
public:
	fDebugSocket(int port);
	fDebugClient* waitForClient();
private:
	int port;
	int sock;
	sockaddr_in srv_addr;
};

#endif /*FDEBUGSOCKET_H_*/
