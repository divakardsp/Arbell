import Image from "next/image";

export default function Home(){

  return (
    <>
      <div>Hello World</div>
       <img
                                    src="/ChatLogo.png"
                                    alt={`Arbell logo`}
                                />


      <img
                                    src="/Arbell-Light.png"
                                    alt={`Arbell logo`}
                                />
    </>
  )
}