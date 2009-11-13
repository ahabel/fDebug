#include "string.h"
#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <errno.h>

#include "global.h"
#include "fdebugcli.h"
#include "cJSON.h"

#include "fdebugconfig.h"

// XML reader libraries for parsing fDebug Variables
#include "libxml/xmlreader.h"
#include "libxml/parser.h"
#include "libxml/tree.h"
#include "libxml/xmlmemory.h"


fDebugCli::fDebugCli() {
	this->config = fDebugConfig::getInstance();
}

bool fDebugCli::process(fDebugMessage *message) {
	// CONTROL
	if (strcmp(message->getType(), "CONTROL") == 0 && this->config->options.control) {
		this->handleControl(message);
		return true;
	}
	
	// MESSAGE
	if (strcmp(message->getType(), "MESSAGE") == 0) {
		this->handleMessage(message);
		return true;
	}
	
	// VARIABLES
	if (strcmp(message->getType(), "VARIABLES") == 0 && this->config->options.variables) {
		this->handleVariables(message);
		return true;
	}
	
	return false;
}

void fDebugCli::handleControl(fDebugMessage *message) {
	// {"type":"CONTROL","payload":{"action":"HELO","url":"\/de\/site\/index.xml","server":"bluepoints.mobile"}}
	// {"type":"CONTROL","payload":{"action":"PING"}}
	// {"type":"CONTROL","payload":{"action":"QUIT"}}
	
	cJSON * payload = message->getPayload();
	char * action = cJSON_GetObjectItem(payload, "action")->valuestring;
	printf(NORMAL "[CONTROL] %s received\n", action);
	delete payload;
	delete action;
}

void fDebugCli::handleMessage(fDebugMessage *message) {
	/* {"type":"MESSAGE","payload":
        {"context":"fCore",
	      "level":"MESSAGE",
	      "message":"process complete",
	      "line":1028,
	      "class":"fSite",
	      "method":"run",
	      "type":"->",
	      "file":"fsite.lib.fcmsv5.php",
	      "version":"$Revision: 1.8 $ ($Date: 2009/10/15 21:04:09 $)"
	     }
	   }
	   
	   details:
	   MESSAGE
		
		fPreProcessor->fallbackHelper()
		Line 110 in fpreprocessor.lib.fcmsv5.php
		$Revision: 1.8 $ ($Date: 2009/10/15 21:04:09 $)
		
		requirement not matched - using fallback
	*/
	
	cJSON * payload = message->getPayload();
	char *lvl = cJSON_GetObjectItem(payload, "level")->valuestring;
	char *msg = cJSON_GetObjectItem(payload, "message")->valuestring;
	
	if (strcmp(lvl, "FATAL") == 0 &&   !this->config->filter.fatal) { return; }
	if (strcmp(lvl, "ERROR") == 0 &&   !this->config->filter.error) { return; }
	if (strcmp(lvl, "WARNING") == 0 && !this->config->filter.warning) { return; }
	if (strcmp(lvl, "MESSAGE") == 0 && !this->config->filter.message) { return; }
	
	if (strcmp(lvl, "FATAL") == 0)   { printf(COLOR_FATAL); }
	if (strcmp(lvl, "ERROR") == 0)   { printf(COLOR_ERROR); }
	if (strcmp(lvl, "WARNING") == 0) { printf(COLOR_WARNING); }
	if (strcmp(lvl, "MESSAGE") == 0) { printf(NORMAL); }
	
	if (!this->config->options.details) {
		printf("[%s]  %s\n", lvl, msg);
	} else {
		printf("---------------------------------------------------------------------------------------\n"
				"[%s]\n"
				"%s%s%s()\n"
				"Line %d in %s\n%s\n\n%s\n",
				lvl,
				cJSON_GetObjectItem(payload, "class")->valuestring,
				cJSON_GetObjectItem(payload, "type")->valuestring,
				cJSON_GetObjectItem(payload, "method")->valuestring,
				cJSON_GetObjectItem(payload, "line")->valueint,
				cJSON_GetObjectItem(payload, "file")->valuestring,
				cJSON_GetObjectItem(payload, "version")->valuestring,
				msg
				);
	}
	
	printf(NORMAL);
	
	delete payload;
	delete lvl;
	delete msg;
}

void fDebugCli::handleVariables(fDebugMessage *message) {
	/*
	 * {"type":    "VARIABLES",
	 *  "payload":
	 *     {"xml":"<?xml version=\"1.0\" encoding=\"utf-8\" ?>
	 *             <vardump>
	 *                <vargroup name=\"OTHER\" type=\"\">
	 *                <vargroup name=\"fVars\" type=\"\">
	 *                <vargroup name=\"VAR\" type=\"\">
	 *                   <var key=\"siteLang\">de<\/var>
	 *                </vargroup>
	 *             </vardump>
	 */
	
	LIBXML_TEST_VERSION
	
	printf(NORMAL);
	
	xmlDocPtr  doc;
	xmlNodePtr root,group;
	
	cJSON * payload = message->getPayload();
	char *xml = cJSON_GetObjectItem(payload, "xml")->valuestring;
	
	doc = xmlReadMemory(xml, strlen(xml), "noname.xml", NULL, 0);
	if (doc == NULL) {
		printf("parsing xml failed\n");
	}
	
	root = xmlDocGetRootElement(doc);
	if (root == NULL) {
		fprintf(stderr,"empty document\n");
		xmlFreeDoc(doc);
		return;
	}
	
	if (xmlStrcmp(root->name, (const xmlChar*) "vardump")) {
		fprintf(stderr, "invalid documentElement");
		xmlFreeDoc(doc);
		return;
	}
	
	// loop <vargroup>
	for(group = root->children; group != NULL; group = group->next) {
		this->processVariablesGroups(group);
	}
	
	xmlFreeDoc(doc);
	xmlCleanupParser();
	return;
}

void fDebugCli::processVariablesGroups(xmlNodePtr group) {
	xmlChar *name = xmlGetProp(group, (const xmlChar*)"name");
	printf(BOLD "-- %s\n" NORMAL, name);
   
	xmlNodePtr cNode;
	
	for(cNode = group->children; cNode != NULL; cNode = cNode->next) {
		// sub <vargroup>
		if (strcmp((const char*)cNode->name, "vargroup") == 0) {
			printf("\t");
			this->processVariablesGroups(cNode);
			printf("\n");
			continue;
		}
		
		// <var>
		if (strcmp((const char*)cNode->name, "var") == 0) {
			xmlChar *key   = xmlGetProp(cNode, (const xmlChar*)"key");
	   	xmlChar *value = xmlNodeGetContent(cNode);
	   	printf("- var: %s -> %s\n", key, value);
	   	xmlFree(key);
	   	xmlFree(value);
		}
   }
	
	xmlFree(name);
}



