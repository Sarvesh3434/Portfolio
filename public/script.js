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
                observer.unobserve(entry.target);
            }

        });

    },
    {
        threshold: 0.12,
        rootMargin: "0px 0px -60px 0px"
    }
);

fadeElements.forEach(function (element) {
    observer.observe(element);
});


async function getProjects() {
    const container = document.getElementById("projects-container");

    try {
        const response = await fetch("/api/projects", {
            credentials: "include"
        });

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (!response.ok) {
            throw new Error("Could not load projects");
        }

        const projects = await response.json();
        container.replaceChildren();

        projects.forEach((project, index) => {
            const card = document.createElement("div");
            card.className = "project-card";

            const number = document.createElement("div");
            number.className = "project-number";
            number.textContent = String(index + 1).padStart(2, "0");

            const image = document.createElement("img");
            image.alt = project.name;

            if (project.image) {
                image.src = project.image;

                image.onerror = function () {
                    image.remove();
                };
            }

            const title = document.createElement("h3");
            title.textContent = project.name;

            const description = document.createElement("p");
            description.textContent = project.description;

            const technologies = document.createElement("div");
            technologies.className = "project-tech";

            project.technologies.forEach((technology) => {
                const tag = document.createElement("span");
                tag.textContent = technology;
                technologies.appendChild(tag);
            });

            const links = document.createElement("div");
            links.className = "project-links";

            if (project.liveDemo) {
                const liveDemo = document.createElement("a");
                liveDemo.href = project.liveDemo;
                liveDemo.target = "_blank";
                liveDemo.rel = "noopener noreferrer";
                liveDemo.textContent = "Live Demo →";
                links.appendChild(liveDemo);
            }

            if (project.github) {
                const github = document.createElement("a");
                github.href = project.github;
                github.target = "_blank";
                github.rel = "noopener noreferrer";
                github.textContent = "GitHub →";
                links.appendChild(github);
            }
            card.append(number, image, title, description, technologies, links);
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Failed to load projects:", error);
        container.textContent = "Unable to load projects.";
    }
}

getProjects();


async function loadUser() {
    try {
        const response = await fetch("/api/me", {
            credentials: "include"
        });

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        const data = await response.json();

        const nameElement = document.getElementById("nav-user-name");

        if (nameElement && data.user) {
            nameElement.textContent = "Hi, " + (data.user.name || data.user.username);
        }
    } catch (error) {
        console.error("Failed to load user:", error);
    }
}

loadUser();


const logoutButton = document.getElementById("logout-btn");

if (logoutButton) {
    logoutButton.addEventListener("click", async function () {
        logoutButton.textContent = "Logging out...";
        logoutButton.disabled = true;

        try {
            await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });
        } catch (error) {
            console.error("Failed to log out:", error);
        }

        window.location.href = "/login";
    });
}
