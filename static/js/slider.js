let swiper = null;

function initSwiper() {
    if (swiper) return;

    swiper = new Swiper(".swiper", {
        effect: "coverflow",
        grabCursor: true,
        centeredSlides: true,
        loop: true,
        speed: 600,
        slidesPerView: "auto",
        coverflowEffect: {
            rotate: 10,
            stretch: 120,
            depth: 200,
            modifier: 1,
            slideShadows: false,
        },
        on: {
            click(event) {
                swiper.slideTo(this.clickedIndex);
                const slide = this.slides[this.clickedIndex];
                const slideName = slide.getAttribute('data-slide');
                if (slideName) navigateTo(slideName);
            },
            slideChange() {
                const slide = this.slides[this.realIndex];
                const slideName = slide.getAttribute('data-slide');
                if (slideName) navigateTo(slideName);
            },
        },
        pagination: {
            el: ".swiper-pagination",
        },
    });

    const swiperContainer = document.querySelector(".swiper");
    swiperContainer.addEventListener("wheel", function(e) {
        e.preventDefault();
        if (e.deltaY > 0) {
            swiper.slideNext();
        } else {
            swiper.slidePrev();
        }
    }, { passive: false });
}