code include:
(1) apps/system/js/dmservice
(2) add code in /system/index.html
 please change as (index_html_change.txt)

merge the patch:
cd KaiOS/apps/system/
patch -p1 < js/dmservice/index_html_change.txt

==========================================================================
// 6.6.1 
// http://dm.wo.com.cn:6001/register?ver=1.1&model=&manuf=& sign=
_url: 'http://dm.wo.com.cn:6001/register?'

if you want to change the register url,
please set 'register.server.url' in webide

eg.
navigator.mozSettings.createLock().set({
      'register.server.url': _url
});

====================================================================
//register.success: 
//1 register success without sim information
//2 register success with sim information
navigator.mozSettings.createLock().set({
      'register.success': 0
});
====================================================================
ro.product.manufacturer=HMD
ro.product.model=TA-1059

PRODUCT_MANUFACTURER=HMD
PRODUCT_MODEL=TA-1059
====================================================================
 navigator.mozSettings.createLock().set({
          'check.total.count': 0
        });
====================================================================
