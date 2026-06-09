import {Navbar, Footer} from "../Components/Sections";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../Components/ui/accordion";
//import styles from "../../style";

const FAQ = () => {

	return (
		<div className="w-full min-h-screen flex flex-col">

			{/* ✅ Fixed Navbar */}
			<div className="fixed top-0 left-0 w-full z-50 bg-navbar">
				<Navbar />
			</div>

			{/* ✅ Ensures content starts below the navbar */}
			<div className="flex-grow pt-[80px] bg-primary">
			<div className="flex items-center justify-center min-h-[50vh]">
				<div className="mx-auto w-full max-w-md px-4">
					<Accordion type="multiple" className="w-full rounded-lg">
					<AccordionItem value="item-1">
						<AccordionTrigger className="p-4 text-base">What is Chakra UI?</AccordionTrigger>
						<AccordionContent className="pb-4 text-gray-600">
							Chakra UI is a simple and modular component library that gives developers
							the building blocks they need to create web applications.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-2">
						<AccordionTrigger className="p-4 text-base">What advantages to use?</AccordionTrigger>
						<AccordionContent className="pb-4 text-gray-600">
							Chakra UI offers a variety of advantages including ease of use,
							accessibility, and customization options. It also provides a comprehensive
							set of UI components and is fully compatible with React.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-3">
						<AccordionTrigger className="p-4 text-base">How to start using Chakra UI?</AccordionTrigger>
						<AccordionContent className="pb-4 text-gray-600">
							To get started with Chakra UI, you can install it via npm or yarn, and
							then import the components you need in your project. The Chakra UI
							documentation is also a great resource for getting started and learning
							more about the library.
						</AccordionContent>
					</AccordionItem>
					</Accordion>
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
export default FAQ;
