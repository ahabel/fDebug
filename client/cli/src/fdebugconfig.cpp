#include "string.h"
#include <stdio.h>
#include <getopt.h>
#include <stdlib.h>

#include "fdebugconfig.h"
#include "global.h"

fDebugConfig* fDebugConfig::m_pInstance = NULL;

fDebugConfig* fDebugConfig::getInstance() {
   if (!m_pInstance) {  // Only allow one instance of class to be generated.
      m_pInstance = new fDebugConfig;
   }
   return m_pInstance;
}

void fDebugConfig::init(int argc, char **argv) {
	// set defaults
	debugOptions options;
	options.port      = DEFAULT_PORT;
	options.control   = true;
	options.details   = false;
	options.variables = false;
	options.strict    = false;
	
	messageFilter filter;
	filter.message   = false;
	filter.warning   = false;
	filter.error     = false;
	filter.fatal     = false;
	
	extern char *optarg;
	extern int optind;
	
	static const struct option long_options[] =
	       {
	           { "help",     no_argument,       0, 'h' },
	           { "port",     required_argument, 0, 'p' },
	           { "details",  no_argument,       0, 'd' },
	           { "variables",no_argument,       0, 'V' },
	           { "nocontrol",no_argument,       0, 'n' },
	           { "strict",   no_argument,       0, 's' },
	           
	           { "message",  no_argument,       0, 'm' },
	           { "error",    no_argument,       0, 'e' },
	           { "warning",  no_argument,       0, 'w' },
	           { "fatal",    no_argument,       0, 'f' },
	          0
	      };
	
	while (optind < argc) {
		int index = -1;
      struct option * opt = 0;
      int result = getopt_long(argc, argv, "+hp:dVnsaxmwefo", long_options, &index);
      if (result == -1) break; /* end of list */
      switch (result) {
      	// Usage
       	case 'h':
       		printUsage();
       		break;
       	case 'p':
       		if (atoi(optarg)>0) {
       			options.port = atoi(optarg);
       		}
        	  	break;
       	case 'd':
       		options.details = true;
       		break;
        	case 'V':
        		options.variables = true;
        		break;
        	case 'n':
        		options.control = false;
        		break;
        	case 's':
        		options.strict = true;
        		break;


         // Host settings
       	case 'a':
       		printf("-a not yet implemented\n");
       		exit(1);
       		break;
       	case 'x':
       		printf("-x not yet implemented\n");
       		exit(1);
       		break;
        		
        	// message filter
        	case 'm':
        		filter.message = true;
        		break;
        	case 'w':
        		filter.warning = true;
        		break;
        	case 'e':
        		filter.error = true;
        		break;
        	case 'f':
        		filter.fatal = true;
        		break;
        	case 0: /* all parameter that do not */
        		/* appear in the optstring */
        		opt = (struct option *)&(long_options[index]);
        		printf("'%s' was specified.", opt->name);
            if (opt->has_arg == required_argument) {
                printf("Arg: <%s>", optarg);
            }
            
            printf("\n");
            break;
        	default: /* unknown */
        		break;
       	}
   }
	
   /* print all other parameters */
   while (optind < argc) {
   	printf("other parameter: <%s>\n", argv[optind++]);
   }
	
   this->initMessageFilter(filter);
   this->options = options;
}

void fDebugConfig::initMessageFilter(messageFilter filter) {
	if (!filter.message && !filter.warning && !filter.error && !filter.fatal) {
		filter.message   = true;
		filter.warning   = true;
		filter.error     = true;
		filter.fatal     = true;
	}
	this->filter = filter;
}

int fDebugConfig::getPort() {
	return this->options.port;
}

void fDebugConfig::printUsage() {
	printf("Usage:\n");
	printf("  -h, --help        display this help\n\n");
	printf("  -p, --port        bind fDebug client to specified port (default: 5005)\n");
	printf("  -d, --details     show detailed fDebug output\n");
	printf("  -V, --variables   show variables\n");
	printf("  -n, --nocontrol   suppress fdebug control output\n");
	printf("  -s, --strict      enable strict mode\n");
	printf("                    - fdebug asks for accepting new incoming connections\n");
	
	printf("\nHost Settings\n");
	printf("  -a, --hosts       only allow specified hosts\n");
	printf("  -x, --exclude     exclude specified hosts from being accepted\n");
	
	printf("\nMessage Filter:\n");
	printf("  -m, --message     show messages\n");
	printf("  -w, --warning     show warnings\n");
	printf("  -e, --error       show errors\n");
	printf("  -f, --fatal       show fatal errors\n\n");
	printf("  If no message filters are specified, all messages will be displayed\n");
	printf("\n");
	exit(0);
}