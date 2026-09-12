#ifndef AIRPLAY_SERVER_H
#define AIRPLAY_SERVER_H

#include <stdbool.h>

#define AIRPLAY_RTSP_PORT  7000
#define AIRPLAY_RTP_PORT   5000

void airplay_server_start(void);
bool airplay_server_is_active(void);
const char* airplay_server_get_client_name(void);

#endif // AIRPLAY_SERVER_H
