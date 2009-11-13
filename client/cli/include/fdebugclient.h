#ifndef FDEBUGCLIENT_H_
#define FDEBUGCLIENT_H_

#include <netinet/in.h>

class fDebugClient {
public:
	sockaddr_in cli_addr;
	fDebugClient(int socket, sockaddr_in addr);
	bool process();
	void closeSocket();
	
	char* getServer();
	char* getURL();
	char* getRemoteAddress();
private:
	bool init();
	bool clientHasData();
	int  clearBuffer();
	bool sendMessage(const char *msg);
	
	char buffer[20000];
	int sock;
	
	char *server;
	char *url;
};

#endif /*FDEBUGCLIENT_H_*/
