document.addEventListener('DOMContentLoaded', () => {
    // Trigger fade-in animations manually if necessary
    document.querySelectorAll('.fade-in').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  
    // Hamburger menu toggle
    document.getElementById("hamburger-btn").addEventListener("click", function () {
      const nav = document.getElementById("navbar-links");
      nav.classList.toggle("show");
    });
  
    // Typewriter effect
    const typewriterElement = document.getElementById('typewriter');
    const typewriterText = 'A decentralized platform for compassion and support using blockchain technology.';
    let index = 0;
  
    function type() {
      if (index < typewriterText.length) {
        typewriterElement.textContent += typewriterText.charAt(index);
        index++;
        setTimeout(type, 35); // typing speed
      }
    }
  
    // Start typewriter after a short delay
    setTimeout(type, 500); 
  });

