const links = document.querySelectorAll('link[rel="import"]')

// Import and add each page to the DOM
Array.prototype.forEach.call(links, (link) => {
  let template = link.import.querySelector('.task-template');
  let clone = document.importNode(template.content, true);
  document.querySelector('.index').appendChild(clone);
  // if (link.href.match('sessionCreate.html')) {
  //   //document.querySelector('body').appendChild(clone);
  // } else {
  //   document.querySelector('.index').appendChild(clone);
  // }
  
});
