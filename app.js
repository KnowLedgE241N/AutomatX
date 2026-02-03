const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const heroBg = document.querySelector(".hero-bg");

if (!prefersReducedMotion) {
  gsap.registerPlugin(ScrollTrigger);

  gsap.set(".nav", { y: -20, opacity: 0 });
  gsap.set(".hero-text > *", { y: 24, opacity: 0 });
  gsap.set([".wave-back", ".wave-mid", ".wave-front"], { y: 80, opacity: 0.4 });
  gsap.set(".wave-line", { scaleX: 0.3, opacity: 0 });
  gsap.set(".wave-dot", { scale: 0.2, opacity: 0 });

  gsap.timeline({ defaults: { ease: "power3.out" } })
    .to(".nav", { y: 0, opacity: 1, duration: 0.8 })
    .to(".hero-text > *", { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }, "-=0.4")
    .to([".wave-back", ".wave-mid", ".wave-front"], { y: 0, opacity: 1, duration: 1.1, stagger: 0.1 }, "-=0.6")
    .to(".wave-line", { scaleX: 1, opacity: 1, duration: 0.8 }, "-=0.6")
    .to(".wave-dot", { scale: 1, opacity: 1, duration: 0.6 }, "-=0.5");

  gsap.to(".wave-line", {
    x: 30,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  gsap.to(".wave-dot", {
    x: 120,
    duration: 4.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  gsap.to([".wave-back", ".wave-mid", ".wave-front"], {
    y: -12,
    duration: 5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    stagger: 0.2,
  });

  gsap.from(".section-label", {
    scrollTrigger: {
      trigger: ".section",
      start: "top 80%",
    },
    y: 20,
    opacity: 0,
    duration: 0.8,
  });

  gsap.to(".about-visual", {
    scrollTrigger: {
      trigger: ".about",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
    backgroundPosition: "50% -40%",
    ease: "none",
  });

  if (heroBg && document.querySelector(".hero")) {
  gsap.to(".hero-bg", {
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
      y: -160,
      ease: "none",
    });
  }

  const timeline = document.querySelector(".timeline");
  if (timeline) {
    const dots = timeline.querySelectorAll(".rail-dot");
    const steps = timeline.querySelectorAll(".timeline-step");
    const fill = timeline.querySelector(".rail-fill");
    const rail = timeline.querySelector(".timeline-rail");

    if (fill) {
      gsap.to(fill, {
        scrollTrigger: {
          trigger: timeline,
          start: "top 70%",
          end: "bottom 0%",
          scrub: true,
        },
        scaleY: 1,
        ease: "none",
      });
    }

    steps.forEach((step, index) => {
      ScrollTrigger.create({
        trigger: step,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => {
          dots.forEach((d) => d.classList.remove("active"));
          dots[index]?.classList.add("active");
        },
        onEnterBack: () => {
          dots.forEach((d) => d.classList.remove("active"));
          dots[index]?.classList.add("active");
        },
        onLeave: () => {},
        onLeaveBack: () => {},
      });
    });

    steps.forEach((step) => {
      gsap.to(step, {
        scrollTrigger: {
          trigger: step,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
      });
    });

    const positionTimeline = () => {
      if (!rail) return;
      const railRect = rail.getBoundingClientRect();
      const railStyles = window.getComputedStyle(rail);
      const padTop = parseFloat(railStyles.paddingTop) || 0;
      const padBottom = parseFloat(railStyles.paddingBottom) || 0;
      const railHeight = railRect.height;
      const innerHeight = Math.max(railHeight - padTop - padBottom, 1);
      const firstStep = steps[0];
      const lastStep = steps[steps.length - 1];
      if (!firstStep || !lastStep) return;

      const firstCenter = firstStep.getBoundingClientRect().top + window.scrollY + firstStep.offsetHeight / 2;
      const lastCenter = lastStep.getBoundingClientRect().top + window.scrollY + lastStep.offsetHeight / 2;
      const span = Math.max(lastCenter - firstCenter, 1);

      dots.forEach((dot, index) => {
        const step = steps[index];
        if (!step) return;
        const stepCenter = step.getBoundingClientRect().top + window.scrollY + step.offsetHeight / 2;
        const t = (stepCenter - firstCenter) / span;
        const y = padTop + t * innerHeight;
        dot.style.top = `${y}px`;
      });

      if (fill) {
        const lastDot = dots[dots.length - 1];
        if (lastDot) {
          const lastTop = parseFloat(lastDot.style.top || '0');
          const maxFill = Math.max(Math.min((lastTop - padTop) / innerHeight, 1), 0);
          fill.style.transformOrigin = 'top';
          fill.style.transform = `scaleY(${maxFill})`;
        }
      }
    };

    window.addEventListener("resize", positionTimeline);
    window.addEventListener("scroll", positionTimeline, { passive: true });
    positionTimeline();
  }
}

if (heroBg) {
  const updateHeroParallax = () => {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const viewH = window.innerHeight || 1;
    const progress = Math.min(Math.max((viewH - rect.top) / (viewH + rect.height), 0), 1);
    const offset = prefersReducedMotion ? 0 : -200 * progress;
    heroBg.style.transform = `translateY(${offset}px)`;
  };

  window.addEventListener("scroll", updateHeroParallax, { passive: true });
  window.addEventListener("resize", updateHeroParallax);
  updateHeroParallax();
}
