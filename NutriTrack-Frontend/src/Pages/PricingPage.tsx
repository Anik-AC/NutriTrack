import {Navbar, Footer} from "../Components/Sections";
import { FaCheckCircle } from 'react-icons/fa'
//import styles from "../../style";

interface Props {
	children: React.ReactNode
  }

  function PriceWrapper(props: Props) {
	const { children } = props

	return (
	  <div className="mb-4 shadow border self-center lg:self-start border-gray-200 rounded-xl bg-white">
		{children}
	  </div>
	)
  }

const ListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-center gap-2">
    <FaCheckCircle className="text-green-500" />
    <span>{children}</span>
  </li>
);

const Pricing = () => {

	return (
		<div className="w-full min-h-screen flex flex-col bg-green-50">

			{/* ✅ Fixed Navbar */}
			<div className="fixed top-0 left-0 w-full z-50 bg-navbar">
				<Navbar />
			</div>

			{/* ✅ Ensures content starts below the navbar */}
			<div className="flex-grow pt-[80px]">
			<div className="py-12">
				<div className="flex flex-col items-center gap-2 text-center">
					<h1 className="text-4xl font-bold">
					Plans that fit your need
					</h1>
					<p className="text-lg text-gray-500">
					Start with a 14-day free trial. No credit card needed. Cancel at anytime.
					</p>
				</div>
				<div className="flex flex-col md:flex-row text-center justify-center gap-4 lg:gap-10 py-10">
					<PriceWrapper>
					<div className="py-4 px-12">
						<p className="font-medium text-2xl">
						Hobby
						</p>
						<div className="flex justify-center items-center gap-1">
						<p className="text-3xl font-semibold">$</p>
						<p className="text-5xl font-black">79</p>
						<p className="text-3xl text-gray-500">/month</p>
						</div>
					</div>
					<div className="flex flex-col items-center bg-gray-50 py-4 rounded-b-xl">
						<ul className="flex flex-col gap-3 text-start px-12">
						<ListItem>unlimited build minutes</ListItem>
						<ListItem>Lorem, ipsum dolor.</ListItem>
						<ListItem>5TB Lorem, ipsum dolor.</ListItem>
						</ul>
						<div className="w-4/5 pt-7">
						<button type="button" className="w-full rounded-md border border-red-500 px-4 py-2 font-semibold text-red-500 hover:bg-red-50">
							Start trial
						</button>
						</div>
					</div>
					</PriceWrapper>

					<PriceWrapper>
					<div className="relative">
						<div className="absolute top-[-16px] left-1/2 -translate-x-1/2">
						<p className="uppercase bg-red-300 px-3 py-1 text-gray-900 text-sm font-semibold rounded-xl">
							Most Popular
						</p>
						</div>
						<div className="py-4 px-12">
						<p className="font-medium text-2xl">Growth</p>
						<div className="flex justify-center items-center gap-1">
							<p className="text-3xl font-semibold">$</p>
							<p className="text-5xl font-black">149</p>
							<p className="text-3xl text-gray-500">/month</p>
						</div>
						</div>
						<div className="flex flex-col items-center bg-gray-50 py-4 rounded-b-xl">
						<ul className="flex flex-col gap-3 text-start px-12">
							<ListItem>unlimited build minutes</ListItem>
							<ListItem>Lorem, ipsum dolor.</ListItem>
							<ListItem>5TB Lorem, ipsum dolor.</ListItem>
							<ListItem>5TB Lorem, ipsum dolor.</ListItem>
							<ListItem>5TB Lorem, ipsum dolor.</ListItem>
						</ul>
						<div className="w-4/5 pt-7">
							<button type="button" className="w-full rounded-md bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600">
							Start trial
							</button>
						</div>
						</div>
					</div>
					</PriceWrapper>
					<PriceWrapper>
					<div className="py-4 px-12">
						<p className="font-medium text-2xl">Scale</p>
						<div className="flex justify-center items-center gap-1">
						<p className="text-3xl font-semibold">$</p>
						<p className="text-5xl font-black">349</p>
						<p className="text-3xl text-gray-500">/month</p>
						</div>
					</div>
					<div className="flex flex-col items-center bg-gray-50 py-4 rounded-b-xl">
						<ul className="flex flex-col gap-3 text-start px-12">
						<ListItem>unlimited build minutes</ListItem>
						<ListItem>Lorem, ipsum dolor.</ListItem>
						<ListItem>5TB Lorem, ipsum dolor.</ListItem>
						</ul>
						<div className="w-4/5 pt-7">
						<button type="button" className="w-full rounded-md border border-red-500 px-4 py-2 font-semibold text-red-500 hover:bg-red-50">
							Start trial
						</button>
						</div>
					</div>
					</PriceWrapper>
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
export default Pricing;
