function create_input(){
  let label_inp = document.createElement("label");
  label_inp.setAttribute("for", "box_inp")
  label_inp.innerHTML = "Текст для input:"
  
  let box_inp = document.createElement("input");
  box_inp.setAttribute("type", "text")
  box_inp.setAttribute("placeholder", "inp_box")
  box_inp.setAttribute("id", "box_inp")

  form.appendChild(label_inp)
  form.appendChild(box_inp)
}
