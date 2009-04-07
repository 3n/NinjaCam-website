window.addEvent('domready', function(){
	new MicroApp('twitter-and-flickr', [
		[ new Flickr, 
		  new Twitter ]
	]).to_html()
})