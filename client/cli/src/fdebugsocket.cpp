#include "string.h"
#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <errno.h>

#include "global.h"
#include "fdebugexception.h"
#include "fdebugconfig.h"
#include "fdebugsocket.h"
#include "fdebugclient.h"


const int MAX_CONNECTIONS = 1;


fDebugSocket::fDebugSocket(int port) {
	printf("Creating socket - port %d\n", port);
	this->port = port;
	
	this->sock = socket(AF_INET, SOCK_STREAM, 0);
	if (this->sock == -1) {
		perror("Cannot create socket");
		exit(1);
	}
	
	// TIME WAIT fix
	int on = 1;
	if ( setsockopt(this->sock, SOL_SOCKET, SO_REUSEADDR, (const char*) &on, sizeof (on)) == -1 ) {
		perror("Cannot set socket options");
		exit(1);
	}
	
	this->srv_addr.sin_family      = AF_INET;
	this->srv_addr.sin_addr.s_addr = INADDR_ANY;
	this->srv_addr.sin_port        = htons(this->port);
	
	int ret = bind(this->sock, (struct sockaddr *) &this->srv_addr, sizeof(this->srv_addr));
	if (ret == -1) {
		perror("Binding socket failed");
		exit(1);
	}
	
	ret = listen(this->sock, MAX_CONNECTIONS);
	if (ret == -1) {
		perror("Socket listen() failed");
		exit(1);
	}
}

fDebugClient* fDebugSocket::waitForClient() {
	printf(NORMAL "Waiting for connections...\n\n");
	
	struct sockaddr_in cli_addr;
	int addrlen = sizeof(cli_addr);
	int newsock = accept(this->sock, (struct sockaddr *) &cli_addr, (socklen_t *) &addrlen);
	if (newsock <= 0) {
		perror("Socket accept() failed");
		throw fDebugException("accepting incoming connection failed");
	}
	
	fDebugClient *client = new fDebugClient(newsock, cli_addr);
	return client;
}






