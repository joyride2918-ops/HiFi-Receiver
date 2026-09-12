#ifndef HTTP_STREAMER_H
#define HTTP_STREAMER_H

#include <stdbool.h>
#include "esp_err.h"

void http_streamer_init(void);
esp_err_t http_streamer_play(const char *url);
void http_streamer_stop(void);
void http_streamer_pause(void);
void http_streamer_resume(void);
bool http_streamer_is_playing(void);
const char* http_streamer_get_url(void);

#endif // HTTP_STREAMER_H
