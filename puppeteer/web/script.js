function toggleDropdownCheckboxes(elementId) {
    const dropdownMenu = document.getElementById(elementId);
    dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
}

function dropdownCheckboxesToggleButton(checkboxesId, button, defaultText) {
    const checkboxes = document.querySelectorAll(checkboxesId);

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", function() {
            const selectedOptions = [];

            checkboxes.forEach(cb => {
                if (cb.checked) {
                    const labelText = cb.parentNode.textContent.trim();
                    selectedOptions.push(labelText);
                }
            });

            if (selectedOptions.length > 0) {
                button.textContent = selectedOptions.join(' / ');
            } else {
                button.textContent = defaultText;
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    const languageSkillButton = document.getElementById("languageSkillButton");
    const employmentContractButton = document.getElementById("employmentContractButton");
    const localityButton = document.getElementById("locality");
    const suitableForButton = document.getElementById("suitableFor");

    const radiusDiv = document.getElementById("radiusDiv");
    const disabledDiv = document.getElementById("disabledDiv");

    languageSkillButton.addEventListener("click", () => toggleDropdownCheckboxes("languageSkill"));
    employmentContractButton.addEventListener("click", () => toggleDropdownCheckboxes("employmentContract"));

    const languageSkillCheckboxesId = ".languageSkillOption";
    const employmentContractCheckboxesId = ".employmentContractOption";

    dropdownCheckboxesToggleButton(employmentContractCheckboxesId, employmentContractButton, "Typ úvazku");
    dropdownCheckboxesToggleButton(languageSkillCheckboxesId, languageSkillButton, "Požadované jazyky");

    localityButton.addEventListener("change", function() {
        if (this.value === "praha") {
            radiusDiv.style.display = "block";
        } else {
            radiusDiv.style.display = "none";
        }
    });

    suitableForButton.addEventListener("change", function() {
        if (this.value === "") {
            disabledDiv.style.display = "block";
        } else {
            disabledDiv.style.display = "none";
        }
    });

    const form = document.getElementById("form");
    form.addEventListener("submit", function(event) {
        event.preventDefault(); // prevents the webpage from reloading when the submit button is pressed
        const formData = new FormData(form);

        formData.get("tags").split(",").map(tag => tag.trim());
    });
});
