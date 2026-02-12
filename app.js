(() => {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  const heroBg = document.querySelector(".hero-bg");

  const canAnimate = !prefersReducedMotion && !!gsap;
  const canScrollTrigger = canAnimate && !!ScrollTrigger;

  const initGsapAnimations = () => {
    if (!canAnimate) return;

    // Never let GSAP failures take down navigation/forms.
    try {
      if (canScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });
      }

      // HERO INTRO (only if the hero exists on this page)
      const hero = document.querySelector(".hero");
      if (hero) {
        const nav = document.querySelector(".nav");
        const heroTextChildren = document.querySelectorAll(".hero-text > *");
        const waveLayers = document.querySelectorAll(".wave-back, .wave-mid, .wave-front");
        const waveLine = document.querySelector(".wave-line");
        const waveDot = document.querySelector(".wave-dot");

        if (nav) gsap.set(nav, { y: -20, opacity: 0, willChange: "transform,opacity" });
        if (heroTextChildren.length) gsap.set(heroTextChildren, { y: 24, opacity: 0, willChange: "transform,opacity" });
        if (waveLayers.length) gsap.set(waveLayers, { y: 80, opacity: 0.4, willChange: "transform,opacity" });
        if (waveLine) gsap.set(waveLine, { scaleX: 0.3, opacity: 0, transformOrigin: "left center", willChange: "transform,opacity" });
        if (waveDot) gsap.set(waveDot, { scale: 0.2, opacity: 0, willChange: "transform,opacity" });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        if (nav) tl.to(nav, { y: 0, opacity: 1, duration: 0.8 });
        if (heroTextChildren.length) tl.to(heroTextChildren, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }, nav ? "-=0.4" : 0);
        if (waveLayers.length) tl.to(waveLayers, { y: 0, opacity: 1, duration: 1.1, stagger: 0.1 }, "-=0.6");
        if (waveLine) tl.to(waveLine, { scaleX: 1, opacity: 1, duration: 0.8 }, "-=0.6");
        if (waveDot) tl.to(waveDot, { scale: 1, opacity: 1, duration: 0.6 }, "-=0.5");

        // Subtle ambient motion (kept transform-only for performance)
        if (waveLine) {
          gsap.to(waveLine, { x: 30, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
        }
        if (waveDot) {
          gsap.to(waveDot, { x: 120, duration: 4.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
        }
        if (waveLayers.length) {
          gsap.to(waveLayers, { y: -12, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.2 });
        }

        // Hero background parallax (ScrollTrigger). If we use this, do NOT also run the manual scroll listener.
        if (canScrollTrigger && heroBg) {
          gsap.to(heroBg, {
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
            y: -160,
            ease: "none",
          });
        }
      }

      // SOLUTIONS SECTION TITLE REVEAL (only when the section exists)
      const solutions = document.querySelector("#solutions");
      if (solutions && canScrollTrigger) {
        const targets = solutions.querySelectorAll(".section-label, h2");
        if (targets.length) {
          gsap.from(targets, {
            scrollTrigger: {
              trigger: solutions,
              start: "top 80%",
              toggleActions: "play none none none",
              once: true,
            },
            y: 16,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.08,
            clearProps: "transform,opacity",
          });
        }
      }

      // ABOUT VISUAL PARALLAX (only if present)
      const about = document.querySelector(".about");
      const aboutVisual = document.querySelector(".about-visual");
      if (about && aboutVisual && canScrollTrigger) {
        gsap.to(aboutVisual, {
          scrollTrigger: {
            trigger: about,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
          backgroundPosition: "50% -40%",
          ease: "none",
        });
      }

      // TIMELINE (How-it-works style) — preserve original behavior with safety guards.
      const timeline = document.querySelector(".timeline");
      if (timeline && canScrollTrigger) {
        const dots = timeline.querySelectorAll(".rail-dot");
        const steps = timeline.querySelectorAll(".timeline-step");
        const fill = timeline.querySelector(".rail-fill");
        const railLine = timeline.querySelector(".rail");
        const rail = timeline.querySelector(".timeline-rail");

        // Precompute fill scale values so the bar lines up with each numbered dot.
        let fillScales = [];
        const setFillScale = fill ? gsap.quickSetter(fill, "scaleY") : null;
        if (fill) {
          gsap.set(fill, { transformOrigin: "top", scaleY: 0 });
        }

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

        if (steps[0]) {
          steps[0].classList.add("is-visible");
        }

        const updateActiveFromViewport = () => {
          if (!steps.length || !dots.length) return;
          const viewportCenter = window.scrollY + window.innerHeight * 0.55;
          let closestIndex = 0;
          let closestDistance = Number.POSITIVE_INFINITY;

          steps.forEach((step, index) => {
            const rect = step.getBoundingClientRect();
            const center = rect.top + window.scrollY + rect.height / 2;
            const distance = Math.abs(center - viewportCenter);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          });

          dots.forEach((dot, idx) => {
            dot.classList.toggle("active", idx === closestIndex);
          });

          if (setFillScale && fillScales[closestIndex] != null) {
            setFillScale(fillScales[closestIndex]);
          }
        };

        const positionTimeline = () => {
          if (!rail || !steps.length) return;
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

          if (fill && dots.length) {
            const firstDotTop = parseFloat(dots[0].style.top || "0");
            const lastDotTop = parseFloat(dots[dots.length - 1].style.top || "0");
            const lineTop = Math.min(firstDotTop, lastDotTop);
            const lineHeight = Math.max(Math.abs(lastDotTop - firstDotTop), 1);

            if (railLine) {
              railLine.style.top = `${lineTop}px`;
              railLine.style.height = `${lineHeight}px`;
            }
            fill.style.top = `${lineTop}px`;
            fill.style.height = `${lineHeight}px`;

            fillScales = [];
            dots.forEach((dot) => {
              const top = parseFloat(dot.style.top || "0");
              const ratio = Math.max(Math.min((top - lineTop) / lineHeight, 1), 0);
              fillScales.push(ratio);
            });
            if (setFillScale && fillScales[0] != null) {
              setFillScale(fillScales[0]);
            }
          }
        };

        window.addEventListener("resize", positionTimeline);
        window.addEventListener("scroll", positionTimeline, { passive: true });
        positionTimeline();

        ScrollTrigger.create({
          trigger: timeline,
          start: "top 70%",
          end: "bottom 30%",
          onUpdate: updateActiveFromViewport,
          onRefresh: () => {
            positionTimeline();
            updateActiveFromViewport();
          },
        });
      }

      if (canScrollTrigger) {
        // Ensure correct measurements after fonts/images settle.
        window.addEventListener("load", () => ScrollTrigger.refresh());
      }
    } catch (err) {
      // Fail gracefully: site should remain fully usable even if GSAP fails.
      console.warn("[AutomatX] Animation initialization skipped:", err);
    }
  };

  const initHeroParallaxFallback = () => {
    // Only run this if we are NOT using the GSAP/ScrollTrigger hero parallax.
    if (!heroBg) return;
    if (prefersReducedMotion) return;
    if (canScrollTrigger) return;

    const updateHeroParallax = () => {
      const hero = document.querySelector(".hero");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      const progress = Math.min(Math.max((viewH - rect.top) / (viewH + rect.height), 0), 1);
      heroBg.style.transform = `translateY(${-200 * progress}px)`;
    };

    window.addEventListener("scroll", updateHeroParallax, { passive: true });
    window.addEventListener("resize", updateHeroParallax);
    updateHeroParallax();
  };

  const initTestimonialSlider = () => {
    const slider = document.querySelector(".testimonial-slider");
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll(".testimonial-slide"));
    const dots = Array.from(document.querySelectorAll(".testimonials .pager span"));
    if (!slides.length) return;

    let current = 0;
    let timerId = null;

    const showSlide = (nextIndex) => {
      const target = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, index) => slide.classList.toggle("is-active", index === target));
      dots.forEach((dot, index) => dot.classList.toggle("is-active", index === target));
      current = target;
    };

    const startAutoplay = () => {
      if (timerId) return;
      timerId = window.setInterval(() => showSlide(current + 1), 4200);
    };

    const stopAutoplay = () => {
      if (!timerId) return;
      window.clearInterval(timerId);
      timerId = null;
    };

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        showSlide(index);
        stopAutoplay();
        startAutoplay();
      });
    });

    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);
    slider.addEventListener("touchstart", stopAutoplay, { passive: true });
    slider.addEventListener("touchend", startAutoplay);

    showSlide(0);
    startAutoplay();
  };

  initGsapAnimations();
  initHeroParallaxFallback();
  initTestimonialSlider();
})();

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (navToggle && navLinks) {
  const isMobileNav = () => window.matchMedia("(max-width: 640px)").matches;
  const closeMobileNav = () => {
    navLinks.classList.remove("open");
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    document.querySelectorAll(".dropdown.open").forEach((dropdown) => dropdown.classList.remove("open"));
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      if (!isMobileNav()) return;
      event.preventDefault();
      const item = toggle.closest(".dropdown");
      if (!item) return;
      const isOpen = item.classList.toggle("open");
      document.querySelectorAll(".dropdown").forEach((dropdown) => {
        if (dropdown !== item) dropdown.classList.remove("open");
      });
      if (!isOpen) {
        item.classList.remove("open");
        toggle.blur();
      }
    });
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (isMobileNav()) closeMobileNav();
    });
  });

  document.addEventListener("click", (event) => {
    if (!isMobileNav()) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!navLinks.classList.contains("open")) return;
    if (target.closest(".nav")) return;
    closeMobileNav();
  });

  document.querySelectorAll(".dropdown").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      if (isMobileNav()) return;
      item.classList.add("open");
    });

    item.addEventListener("mouseleave", () => {
      if (isMobileNav()) return;
      item.classList.remove("open");
    });
  });

  window.addEventListener("resize", () => {
    if (!isMobileNav()) closeMobileNav();
  });
}

const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector(".form-submit");
    const captchaToken = window.grecaptcha ? window.grecaptcha.getResponse() : "";

    if (!captchaToken) {
      if (formStatus) {
        formStatus.textContent = "Please complete the CAPTCHA first.";
        formStatus.classList.add("error");
        formStatus.classList.remove("success");
      }
      return;
    }

    const formData = new FormData(contactForm);
    const payload = {
      name: (formData.get("name") || "").toString().trim(),
      email: (formData.get("email") || "").toString().trim(),
      subject: (formData.get("subject") || "").toString().trim(),
      interest: (formData.get("interest") || "").toString().trim(),
      message: (formData.get("message") || "").toString().trim(),
      captchaToken,
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }
    if (formStatus) {
      formStatus.textContent = "";
      formStatus.classList.remove("error", "success");
    }

    try {
      const response = await fetch("/.netlify/functions/contact-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to send your message.");
      }

      if (formStatus) {
        formStatus.textContent = data.message || "Message sent successfully.";
        formStatus.classList.add("success");
      }
      contactForm.reset();
      if (window.grecaptcha) window.grecaptcha.reset();
    } catch (error) {
      if (formStatus) {
        formStatus.textContent = error.message || "Something went wrong. Please try again.";
        formStatus.classList.add("error");
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
    }
  });
}
