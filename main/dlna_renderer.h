#ifndef DLNA_RENDERER_H
#define DLNA_RENDERER_H

#include <stdbool.h>

#define DLNA_SSDP_PORT   1900
#define DLNA_HTTP_PORT   49152

void dlna_renderer_start(void);
bool dlna_renderer_is_active(void);
const char* dlna_renderer_get_current_uri(void);

#endif // DLNA_RENDERER_H
