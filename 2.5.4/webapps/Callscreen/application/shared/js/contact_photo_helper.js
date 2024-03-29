
(function(exports){'use strict';function getThumbnail(contact){return getOnePhoto(contact,'begin');}
function getFullResolution(contact){return getOnePhoto(contact,'end');}
function getOnePhoto(contact,position){if(!contact||!contact.photo||!contact.photo.length){return null;}
if(contact.photo.length===1){return contact.photo[0];}
var photos=contact.photo;var category=contact.category;if(Array.isArray(category)&&category.indexOf('fb_linked')!==-1){if(photos.length>=4){return photos[(position=='begin')?1:0];}
return photos[0];}
photos=photosBySize(contact);var index=(position=='begin')?0:photos.length-1;return photos[index];}
function photosBySize(contact){var photos=contact.photo.slice(0);photos.sort(function(p1,p2){if(size(p1)<size(p2)){return-1;}
if(size(p1)>size(p2)){return 1;}
return 0;});return photos;}
function size(photo){if(typeof photo=='string'){return photo.length;}
return photo.size;}
function getPhotoHeader(contact,contactName){if(contact&&contact.photo&&contact.photo.length){var contactImage=getThumbnail(contact);return getPhotoHeaderByImg(contactImage);}else{return getDefaultImage(contact,contactName);}}
function getFirstLetter(contact,contactName){return'';}
function getDefaultImage(contact,contactName){var pictureContainer=document.createElement("span");pictureContainer.classList.add('defaultPicture');pictureContainer.classList.add('contactHeaderImage');pictureContainer.setAttribute("style","");var posVertical=['top','center','bottom'];var posHorizontal=['left','center','right'];var position=posHorizontal[Math.floor(Math.random()*posHorizontal.length)]+' '+
posVertical[Math.floor(Math.random()*posVertical.length)];pictureContainer.dataset.group=getFirstLetter(contact,contactName);pictureContainer.style.backgroundPosition=position;return pictureContainer;}
function getPhotoHeaderByImg(contactImage){var photoView=document.createElement("span");photoView.classList.add('contactHeaderImage');try{photoView.dataset.src=window.URL.createObjectURL(contactImage);photoView.setAttribute('style','background-image:url('+photoView.dataset.src+')');return photoView;}catch(err){console.warn('Failed to create contact picture : '+
contactImage+', error: '+err);}}
exports.ContactPhotoHelper={getThumbnail:getThumbnail,getFullResolution:getFullResolution,getPhotoHeader:getPhotoHeader};})(window);