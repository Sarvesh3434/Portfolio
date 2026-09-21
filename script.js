const grid = document.querySelector(".grid");

let mouseX = 0;
let mouseY = 0;

let currentX = 0;
let currentY = 0;

document.addEventListener("mousemove", function (event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

function animateGrid() {
    currentX += (mouseX - currentX) * 0.08;
    currentY += (mouseY - currentY) * 0.08;

    const x = (currentX / window.innerWidth - 0.5) * 40;
    const y = (currentY / window.innerHeight - 0.5) * 40;

    grid.style.transform =
        `perspective(800px)
         rotateX(${55 - y * 0.15}deg)
         rotateY(${x * 0.15}deg)
         scale(1.5)
         translate(${x}px, ${y}px)`;
    
    requestAnimationFrame(animateGrid);
}

animateGrid();


const fadeElements = document.querySelectorAll(".fade-in");

const observer = new IntersectionObserver(
    function (entries) {

        entries.forEach(function (entry) {

            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            } else {
                entry.target.classList.remove("show");
            }

        });

    },
    {
        threshold: 0.35
    }
);

fadeElements.forEach(function (element) {
    observer.observe(element);
});
