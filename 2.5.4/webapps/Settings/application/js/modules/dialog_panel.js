define(["require","modules/panel"],function(t){var e=t("modules/panel"),n=function(t){var n=function(){},i=e(t);return i.onSubmit=t.onSubmit||n,i.onCancel=t.onCancel||n,i.onSubmit=i.onSubmit.bind(t),i.onCancel=i.onCancel.bind(t),i};return n});