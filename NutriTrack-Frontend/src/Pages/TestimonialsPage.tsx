import {Navbar, Footer} from "../Components/Sections";
import { Avatar, AvatarImage, AvatarFallback } from "../Components/ui/avatar";

//import styles from "../../style";
const testimonials = [
	{
	  name: 'Brandon P.',
	  role: 'Chief Marketing Officer',
	  content:
		'It really saves me time and effort. It is exactly what our business has been lacking. EEZY is the most valuable business resource we have EVER purchased. After using EEZY my business skyrocketed!',
	  avatar:
		'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=334&q=80',
	},
	{
	  name: 'Krysta B.',
	  role: 'Entrepreneur',
	  content:
		"I didn't even need training. We've used EEZY for the last five years. I have gotten at least 50 times the value from EEZY. I made back the purchase price in just 48 hours!",
	  avatar:
		'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=334&q=80',
	},
	{
	  name: 'Darcy L.',
	  role: 'Movie star',
	  content:
		"Thank you for making it painless, pleasant and most of all, hassle free! I'm good to go. No matter where you go, EEZY is the coolest, most happening thing around! I love EEZY!",
	  avatar:
		'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=334&q=80',
	},
	{
	  name: 'Daniel T.',
	  role: 'Musician',
	  content:
		'I am so pleased with this product. EEZY is both attractive and highly adaptable. Without EEZY, we would have gone bankrupt by now. Thank you for creating this product!',
	  avatar:
		'https://images.unsplash.com/photo-1606513542745-97629752a13b?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=334&q=80',
	},
  ]

  const backgrounds = [
	`url("data:image/svg+xml, %3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'560\' height=\'185\' viewBox=\'0 0 560 185\' fill=\'none\'%3E%3Cellipse cx=\'102.633\' cy=\'61.0737\' rx=\'102.633\' ry=\'61.0737\' fill=\'%23ED64A6\' /%3E%3Cellipse cx=\'399.573\' cy=\'123.926\' rx=\'102.633\' ry=\'61.0737\' fill=\'%23F56565\' /%3E%3Cellipse cx=\'366.192\' cy=\'73.2292\' rx=\'193.808\' ry=\'73.2292\' fill=\'%2338B2AC\' /%3E%3Cellipse cx=\'222.705\' cy=\'110.585\' rx=\'193.808\' ry=\'73.2292\' fill=\'%23ED8936\' /%3E%3C/svg%3E")`,
	`url("data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg' width='560' height='185' viewBox='0 0 560 185' fill='none'%3E%3Cellipse cx='457.367' cy='123.926' rx='102.633' ry='61.0737' transform='rotate(-180 457.367 123.926)' fill='%23ED8936'/%3E%3Cellipse cx='160.427' cy='61.0737' rx='102.633' ry='61.0737' transform='rotate(-180 160.427 61.0737)' fill='%2348BB78'/%3E%3Cellipse cx='193.808' cy='111.771' rx='193.808' ry='73.2292' transform='rotate(-180 193.808 111.771)' fill='%230BC5EA'/%3E%3Cellipse cx='337.295' cy='74.415' rx='193.808' ry='73.2292' transform='rotate(-180 337.295 74.415)' fill='%23ED64A6'/%3E%3C/svg%3E")`,
	`url("data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg' width='560' height='185' viewBox='0 0 560 185' fill='none'%3E%3Cellipse cx='102.633' cy='61.0737' rx='102.633' ry='61.0737' fill='%23ED8936'/%3E%3Cellipse cx='399.573' cy='123.926' rx='102.633' ry='61.0737' fill='%2348BB78'/%3E%3Cellipse cx='366.192' cy='73.2292' rx='193.808' ry='73.2292' fill='%230BC5EA'/%3E%3Cellipse cx='222.705' cy='110.585' rx='193.808' ry='73.2292' fill='%23ED64A6'/%3E%3C/svg%3E")`,
	`url("data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg' width='560' height='185' viewBox='0 0 560 185' fill='none'%3E%3Cellipse cx='457.367' cy='123.926' rx='102.633' ry='61.0737' transform='rotate(-180 457.367 123.926)' fill='%23ECC94B'/%3E%3Cellipse cx='160.427' cy='61.0737' rx='102.633' ry='61.0737' transform='rotate(-180 160.427 61.0737)' fill='%239F7AEA'/%3E%3Cellipse cx='193.808' cy='111.771' rx='193.808' ry='73.2292' transform='rotate(-180 193.808 111.771)' fill='%234299E1'/%3E%3Cellipse cx='337.295' cy='74.415' rx='193.808' ry='73.2292' transform='rotate(-180 337.295 74.415)' fill='%2348BB78'/%3E%3C/svg%3E")`,
  ]

  const quoteSvg = `url("data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg' width='29' height='21' viewBox='0 0 29 21' fill='none'%3E%3Cpath d='M6.91391 21C4.56659 21 2.81678 20.2152 1.66446 18.6455C0.55482 17.0758 0 15.2515 0 13.1727C0 11.2636 0.405445 9.43939 1.21634 7.7C2.0699 5.91818 3.15821 4.3697 4.48124 3.05454C5.84695 1.69697 7.31935 0.678787 8.89845 0L13.3157 3.24545C11.5659 3.96667 9.98676 4.94242 8.57837 6.17273C7.21266 7.36061 6.25239 8.63333 5.69757 9.99091L6.01766 10.1818C6.27373 10.0121 6.55114 9.88485 6.84989 9.8C7.19132 9.71515 7.63944 9.67273 8.19426 9.67273C9.34658 9.67273 10.4776 10.097 11.5872 10.9455C12.7395 11.7939 13.3157 13.1091 13.3157 14.8909C13.3157 16.8848 12.6542 18.4121 11.3311 19.4727C10.0508 20.4909 8.57837 21 6.91391 21ZM22.5982 21C20.2509 21 18.5011 20.2152 17.3488 18.6455C16.2391 17.0758 15.6843 15.2515 15.6843 13.1727C15.6843 11.2636 16.0898 9.43939 16.9007 7.7C17.7542 5.91818 18.8425 4.3697 20.1656 3.05454C21.5313 1.69697 23.0037 0.678787 24.5828 0L29 3.24545C27.2502 3.96667 25.6711 4.94242 24.2627 6.17273C22.897 7.36061 21.9367 8.63333 21.3819 9.99091L21.702 10.1818C21.9581 10.0121 22.2355 9.88485 22.5342 9.8C22.8756 9.71515 23.3238 9.67273 23.8786 9.67273C25.0309 9.67273 26.1619 10.097 27.2715 10.9455C28.4238 11.7939 29 13.1091 29 14.8909C29 16.8848 28.3385 18.4121 27.0155 19.4727C25.7351 20.4909 24.2627 21 22.5982 21Z' fill='%239F7AEA'/%3E%3C/svg%3E")`;

  interface TestimonialCardProps {
	name: string
	role: string
	content: string
	avatar: string
	index: number
  }

  function TestimonialCard(props: TestimonialCardProps) {
	const { name, role, content, avatar, index } = props
	return (
	  <div className="relative flex flex-col-reverse md:flex-row w-full max-w-[640px] justify-between rounded-xl p-10 shadow-lg bg-white">
		{/* decorative blurred background */}
		<div
		  aria-hidden
		  className="absolute inset-0 -z-10 h-full w-full max-w-[640px] bg-cover bg-no-repeat blur-[40px] scale-[0.98]"
		  style={{ backgroundImage: backgrounds[index % 4] }}
		/>
		{/* decorative quote mark */}
		<span
		  aria-hidden
		  className="absolute left-[35px] top-[-10px] h-[21px] w-[29px] bg-cover"
		  style={{ backgroundImage: quoteSvg }}
		/>
		<div className="flex flex-col text-left justify-between">
		  <p className="font-[Inter] font-medium text-[15px] pb-4">
			{content}
		  </p>
		  <p className="font-[Work_Sans] font-bold text-sm">
			{name}
			<span className="font-[Inter] font-medium text-gray-500">
			  {' '}
			  - {role}
			</span>
		  </p>
		</div>
		<Avatar className="self-center size-20 m-0 mb-[35px] md:mb-0 md:ml-[50px]">
		  <AvatarImage src={avatar} alt={name} />
		  <AvatarFallback>{name.charAt(0)}</AvatarFallback>
		</Avatar>
	  </div>
	)
  }

const Testimonials = () => {

	return (
		<div className="w-full min-h-screen flex flex-col bg-green-50">

			{/* ✅ Fixed Navbar */}
			<div className="fixed top-0 left-0 w-full z-50 bg-navbar">
				<Navbar />
			</div>

			{/* ✅ Ensures content starts below the navbar */}
			<div className="flex-grow pt-[80px]">
			<div className="flex flex-col text-center w-full overflow-hidden pt-[50px] pb-[50px] justify-center">
			<div className="w-full sm:max-w-lg lg:max-w-xl mx-auto">
				<h3 className="font-[Work_Sans] font-bold text-[20px] uppercase text-purple-400">
				People love us
				</h3>
				<h1 className="py-5 text-[48px] font-[Work_Sans] font-bold text-gray-700">
				You&apos;re in good company
				</h1>
				<h2 className="mx-auto w-[70%] font-[Inter] font-medium text-gray-500">
				See why over{' '}
				<strong className="text-gray-700">
					150,000+
				</strong>{' '}
				influencers use EEZY to manage their social media content!
				</h2>
			</div>
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-20 mt-16 mb-16 mx-auto">
				{testimonials.map((cardInfo, index) => (
				<TestimonialCard key={index} {...cardInfo} index={index} />
				))}
			</div>
			<div>
				<svg viewBox="0 0 40 35" className="mt-14 w-10 h-10 text-purple-400 mx-auto">
				<path
					fill={'currentColor'}
					d="M10.7964 5.04553e-07C8.66112 -0.000123335 6.57374 0.632971 4.79827 1.81922C3.0228 3.00547 1.63898 4.69158 0.82182 6.66433C0.00466116 8.63708 -0.209132 10.8079 0.207477 12.9021C0.624087 14.9964 1.65239 16.9201 3.16233 18.4299L19.1153 34.3828C19.2395 34.5074 19.3871 34.6062 19.5496 34.6736C19.7121 34.741 19.8863 34.7757 20.0622 34.7757C20.2381 34.7757 20.4123 34.741 20.5748 34.6736C20.7373 34.6062 20.8848 34.5074 21.0091 34.3828L36.962 18.4272C38.9319 16.3917 40.0228 13.6636 39.9996 10.8311C39.9764 7.99858 38.8409 5.28867 36.838 3.28573C34.835 1.28279 32.1251 0.147283 29.2926 0.124081C26.4601 0.100879 23.732 1.19184 21.6965 3.1617L20.0622 4.79337L18.4305 3.1617C17.4276 2.15892 16.237 1.36356 14.9267 0.821064C13.6163 0.278568 12.2119 -0.000433066 10.7937 5.04553e-07H10.7964Z"
				/>
				</svg>
			</div>
			</div>
			</div>
			{/* ✅ Footer stays at bottom */}
			<div className="w-full mt-auto bg-footer">
				<Footer />
			</div>
		</div>
	);
};
export default Testimonials;
