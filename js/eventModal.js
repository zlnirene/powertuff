// scripts/eventModal.js
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("eventModal");
  const closeModal = document.getElementById("closeModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");
  const modalImage = document.getElementById("modalImage");

  // Ambil semua tombol dengan class .see-details-btn
  const detailButtons = document.querySelectorAll(".see-details-btn");

  detailButtons.forEach(button => {
    button.addEventListener("click", () => {
      const title = button.getAttribute("data-title");
      const description = button.getAttribute("data-description");
      const image = button.getAttribute("data-image");

      // Masukkan data ke modal
      modalTitle.textContent = title;
      modalDescription.textContent = description;
      modalImage.src = image;

      // Tampilkan modal
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    });
  });

  // Tutup modal
  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Tutup modal kalau klik di luar konten
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
});